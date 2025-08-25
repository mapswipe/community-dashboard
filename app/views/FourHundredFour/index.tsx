import PreloadMessage from '#base/components/PreloadMessage';

interface Props {
    className?: string;
}

function FourHundredFour(props: Props) {
    const { className } = props;

    return (
        <PreloadMessage
            className={className}
            heading="404"
            content="The page you are looking for does not exist"
        />
    );
}

export default FourHundredFour;
